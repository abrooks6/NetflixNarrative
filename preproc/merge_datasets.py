### The real preprocess script :)
import csv
import os
from tqdm import tqdm
import time
import json

PREPROCESS_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_DIR = os.path.join(PREPROCESS_DIR, '..', 'data')
UNFILTERED_NETFLIX = os.path.join(DATA_DIR, 'netflix_titles.csv')
UNFILTERED_IMDB_RATINGS = os.path.join(DATA_DIR, 'title.ratings.tsv')
UNFILTERED_IMDB_TITLE_INFO = os.path.join(DATA_DIR, 'title.basics.tsv')
OUTPUT_DATA = os.path.join(DATA_DIR, 'rated_netflix_movies.json')

# IMDB datafile merging & filtering
clean_title = lambda x: ' '.join(x.lower().split())
to_identifier = lambda release_year, title: '{}_{}'.format(release_year, title)

def is_imdb_movie(movie_info):
    return movie_info['titleType'].lower() == 'movie'

def get_csv_generator(file_path, delimiter=','):
    if not os.path.isfile(file_path):
        raise FileNotFoundError('Unfiltered data file {} does not exist'.format(file_path))
    in_file_ptr = open(file_path, 'r')
    csv_reader = csv.DictReader(in_file_ptr, delimiter=delimiter)
    return csv_reader

def extract_basic_movie_info(imdb_basic_info_gen):
    '''Exhaust the basic info generator. Build a dictionary mapping movie IDs to
    relevant fields when object type is a movie.'''
    imdb_movie_map = {}
    print('Extracting movies map based on IMDB ID - this will take a minute')
    for movie_info in tqdm(imdb_basic_info_gen):
        movie_id = movie_info['tconst']
        if movie_id in imdb_movie_map.keys():
            raise Exception('ERROR: Conflicting IDs in IMDB Basic Titles Dataset')
        if is_imdb_movie(movie_info):
            # Preprocess and preserve key fields. This consists of converting years to ints & 
            # cleaning the whitespace / capitalization of the movie so that we can match against
            # netflix.
            rel_movie_info = {}
            try:
                rel_movie_info['primaryTitle'] = clean_title(movie_info['primaryTitle'])
                rel_movie_info['startYear'] = int(movie_info['startYear'])
                imdb_movie_map[movie_id] = rel_movie_info
            # Skip any movies with missing information [values "\N"]
            except ValueError:
                pass
    print('Extracted {} unique movies from basic info in IMDB'.format(len(imdb_movie_map)))
    return imdb_movie_map

def merge_imdb_data(imdb_movie_map, imdb_rating_gen):
    '''Merge rating information into movie info - keep only movies with a rating.'''
    rated_movie_map = {}
    print('Merging extracted movies with movie ratings...')
    for rating_info in tqdm(imdb_rating_gen):
        movie_id = rating_info['tconst']
        try:
            # Add rating information
            movie_info = imdb_movie_map[movie_id]
            movie_info['averageRating'] = rating_info['averageRating']
            movie_info['numVotes'] = rating_info['numVotes']
            identifier = to_identifier(movie_info['startYear'], movie_info['primaryTitle'])
            rated_movie_map[identifier] = movie_info
        # Skip all movies that don't have mapped info
        except KeyError:
            pass
    print('Extracted {} movies with ratings from IMDB'.format(len(rated_movie_map)))
    return rated_movie_map

# Netflix & IMDB dataset merging
def merge_netflix_with_imdb_ratings(rated_movie_map, netflix_gen):
    rated_netflix_movies = []
    for netflix_entity in netflix_gen:
        # Only consider movies
        if netflix_entity['type'].strip().lower() == 'movie':
            cleaned_title = clean_title(netflix_entity['title'])
            release_year = int(netflix_entity ['release_year'])
            identifier = to_identifier(release_year, cleaned_title)
            # Check to see if the year_title identifier matches IMDB
            if identifier in rated_movie_map:
                imdb_info = rated_movie_map[identifier]
                # Build a dictionary of all the relevant information between IMDB / netflix
                rated_movie_info = {
                    'IMDB Rating': float(imdb_info['averageRating']),
                    'Vote Count': int(imdb_info['numVotes']),
                    'Release Year': int(netflix_entity ['release_year']),
                    'Netflix Title': netflix_entity['title'],
                    'Director': netflix_entity['director'],
                    'cast': netflix_entity['cast'],
                    'Year Added': int(netflix_entity['date_added'].split(',')[-1]),
                    'Rating': netflix_entity['rating'],
                    'Category': netflix_entity['listed_in'],
                    'Description': netflix_entity['description']
                }
                rated_netflix_movies.append(rated_movie_info)
    print('Matched again {} movies from Netflix'.format(len(rated_netflix_movies)))
    return rated_netflix_movies

def write_slide_info(slide_info):
    with open(OUTPUT_DATA, 'w') as out_file:
        json.dump(slide_info, out_file, indent=4)

if __name__ == '__main__':
    netflix_gen = get_csv_generator(UNFILTERED_NETFLIX)
    imdb_basic_info_gen = get_csv_generator(UNFILTERED_IMDB_TITLE_INFO, delimiter='\t')
    imdb_rating_gen = get_csv_generator(UNFILTERED_IMDB_RATINGS, delimiter='\t')
    # Get all of the movies & their corresponding release years. This takes about a minute
    imdb_movie_map = extract_basic_movie_info(imdb_basic_info_gen)
    # Pair the basic movie information with ratings
    rated_movie_map = merge_imdb_data(imdb_movie_map, imdb_rating_gen)
    # And match based on title and release year against Netflix movies
    slide_info = merge_netflix_with_imdb_ratings(rated_movie_map, netflix_gen)
    # Then export the result
    write_slide_info(slide_info)

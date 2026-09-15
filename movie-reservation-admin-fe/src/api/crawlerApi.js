import axios from 'axios';

const CRAWLER_API_URL = import.meta.env.VITE_CRAWLER_API_URL || 'http://localhost:8002';

const crawlerClient = axios.create({
  baseURL: CRAWLER_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000 // 2 minutes for crawling operations
});

const crawlerApi = {
  getStatus() {
    return crawlerClient.get('/api/crawler/status').then(res => res.data);
  },

  crawlShowtimes() {
    return crawlerClient.post('/api/crawler/showtimes').then(res => res.data);
  },

  crawlMovies() {
    return crawlerClient.post('/api/crawler/movies').then(res => res.data);
  },

  crawlArticles() {
    return crawlerClient.post('/api/crawler/articles').then(res => res.data);
  },

  crawlReviews(movieId = null) {
    return crawlerClient.post('/api/crawler/reviews', null, {
      params: movieId ? { movie_id: movieId } : {}
    }).then(res => res.data);
  },

  crawlAll() {
    return crawlerClient.post('/api/crawler/all').then(res => res.data);
  }
};

export default crawlerApi;

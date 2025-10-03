// Movie Player JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const videoPlayer = document.getElementById('video-player');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const serverSelect = document.getElementById('server-select');
  const backButton = document.getElementById('back-button');
  
  // Movie info elements
  const movieTitle = document.getElementById('movie-title');
  const movieYear = document.getElementById('movie-year');
  const detailedTitle = document.getElementById('detailed-title');
  const detailedYear = document.getElementById('detailed-year');
  const detailedDuration = document.getElementById('detailed-duration');
  const detailedGenre = document.getElementById('detailed-genre');
  const movieDescription = document.getElementById('movie-description');
  const movieCast = document.getElementById('movie-cast');
  
  // Sample movie data (in a real app, this would come from an API)
  const movieData = {
    title: 'Sample Movie Title',
    year: '2023',
    duration: '2h 15m',
    genre: 'Action, Adventure',
    description: 'This is a sample movie description. In a real application, this would contain detailed information about the movie plot, cast, and crew.',
    cast: 'Actor 1, Actor 2, Actor 3',
    poster: './assets/placeholder-poster.jpg',
    servers: {
      server1: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', // Sample video
      server2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      server3: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    }
  };
  
  // Initialize the player
  function initPlayer() {
    // Set movie info
    movieTitle.textContent = movieData.title;
    movieYear.textContent = `${movieData.year} • ${movieData.genre} • ${movieData.duration}`;
    detailedTitle.textContent = movieData.title;
    detailedYear.textContent = movieData.year;
    detailedDuration.textContent = movieData.duration;
    detailedGenre.textContent = movieData.genre;
    movieDescription.textContent = movieData.description;
    movieCast.textContent = movieData.cast;
    
    // Set poster image
    const posterImg = document.getElementById('movie-poster');
    posterImg.src = movieData.poster;
    posterImg.onerror = function() {
      // If image fails to load, use a default placeholder
      this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%23333"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23666" font-family="Arial">Movie Poster</text></svg>';
    };
    
    // Set up server selection
    serverSelect.addEventListener('change', handleServerChange);
    
    // Set up back button
    backButton.addEventListener('click', () => {
      window.history.back();
    });
    
    // Load first server if available
    if (serverSelect.options.length > 1) {
      serverSelect.selectedIndex = 1;
      loadVideoSource(movieData.servers.server1);
    }
  }
  
  // Handle server change
  function handleServerChange() {
    const selectedServer = serverSelect.value;
    
    if (selectedServer && movieData.servers[selectedServer]) {
      loadVideoSource(movieData.servers[selectedServer]);
    } else {
      showError('Please select a valid server');
    }
  }
  
  // Load video source
  function loadVideoSource(source) {
    hideError();
    showLoading();
    
    // Set the video source
    videoPlayer.src = source;
    
    // Load the video
    videoPlayer.load();
    
    // Handle video events
    videoPlayer.addEventListener('loadeddata', () => {
      hideLoading();
    });
    
    videoPlayer.addEventListener('error', () => {
      hideLoading();
      showError('Failed to load video from this source. Please try another server.');
    });
    
    videoPlayer.addEventListener('canplay', () => {
      hideLoading();
    });
  }
  
  // Show loading indicator
  function showLoading() {
    loadingIndicator.style.display = 'block';
  }
  
  // Hide loading indicator
  function hideLoading() {
    loadingIndicator.style.display = 'none';
  }
  
  // Show error message
  function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Hide error after 5 seconds
    setTimeout(hideError, 5000);
  }
  
  // Hide error message
  function hideError() {
    errorMessage.classList.add('hidden');
  }
  
  // Initialize the player when the page loads
  initPlayer();
});
const API_BASE = 'http://127.0.0.1:8000/api';
const statusUrl = `${API_BASE}/admin/status`;

export function initVoteForm() {
  const voteForm = document.getElementById('vote-form') as HTMLFormElement;
  const voteLoading = document.getElementById('vote-loading') as HTMLElement;
  const voteEmpty = document.getElementById('vote-empty') as HTMLElement;
  const voteCard = document.getElementById('vote-card') as HTMLElement;
  const voteMessage = document.getElementById('vote-message') as HTMLElement;
  const selectedTitle = document.getElementById('selected-title') as HTMLElement;
  const selectedDirector = document.getElementById('selected-director') as HTMLElement;
  const voteButton = document.getElementById('vote-button') as HTMLButtonElement;

  let currentMovieId: number | null = null;

  const showMessage = (text: string, success = true) => {
    voteMessage.className = `rounded-xl p-4 ${success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
    voteMessage.textContent = text;
    voteMessage.hidden = false;
  };

  const loadSelectedMovie = async () => {
    voteLoading.hidden = false;
    voteEmpty.hidden = true;
    voteCard.hidden = true;
    voteMessage.hidden = true;

    try {
      const response = await fetch(statusUrl);
      if (!response.ok) {
        throw new Error('Unable to load current movie.');
      }

      const status = await response.json();
      if (!status.selected_movie) {
        voteEmpty.hidden = false;
        return;
      }

      currentMovieId = status.selected_movie.id;
      selectedTitle.textContent = status.selected_movie.title;
      selectedDirector.textContent = `Directed by ${status.selected_movie.director}`;
      voteCard.hidden = false;
    } catch (error) {
      showMessage((error as Error).message, false);
    } finally {
      voteLoading.hidden = true;
    }
  };

  voteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentMovieId) return;
    voteButton.disabled = true;
    voteButton.textContent = 'Submitting...';
    voteMessage.hidden = true;

    const reviewer_name = (document.getElementById('reviewer-name') as HTMLInputElement).value.trim() || null;
    const payload = {
      movie_id: currentMovieId,
      reviewer_name,
      score_story: Number((document.getElementById('score-story') as HTMLSelectElement).value),
      score_characters: Number((document.getElementById('score-characters') as HTMLSelectElement).value),
      score_cinematography: Number((document.getElementById('score-cinematography') as HTMLSelectElement).value),
      score_overall: Number((document.getElementById('score-overall') as HTMLSelectElement).value),
    };

    try {
      const response = await fetch(`${API_BASE}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Unable to submit rating.');
      }
      showMessage('Rating submitted — thanks for voting!', true);
      voteForm.reset();
    } catch (error) {
      showMessage((error as Error).message, false);
    } finally {
      voteButton.disabled = false;
      voteButton.textContent = 'Submit Rating';
    }
  });

  loadSelectedMovie();

  // Auto-refresh every 5 seconds to detect newly selected movies
  setInterval(loadSelectedMovie, 5000);
}

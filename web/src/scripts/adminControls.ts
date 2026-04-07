const API_BASE = 'http://127.0.0.1:8000/api';
const statusUrl = `${API_BASE}/admin/status`;
const rollUrl = `${API_BASE}/admin/roll`;
const lockUrl = `${API_BASE}/admin/lock-submissions`;
const resetUrl = `${API_BASE}/admin/reset`;
const pendingUrl = `${API_BASE}/movies?pending_only=true`;
const resultsUrl = `${API_BASE}/admin/results`;

export function initAdminControls() {
  const rollButton = document.getElementById('roll-button') as HTMLButtonElement;
  const lockButton = document.getElementById('lock-button') as HTMLButtonElement;
  const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
  const adminStatus = document.getElementById('admin-status') as HTMLElement;
  const adminMessage = document.getElementById('admin-message') as HTMLElement;
  const selectedMovie = document.getElementById('selected-movie') as HTMLElement;
  const pendingList = document.getElementById('pending-list') as HTMLElement;
  const resultsList = document.getElementById('results-list') as HTMLElement;

  const showAdminMessage = (text: string, success = true) => {
    adminMessage.className = `mt-4 rounded-xl p-4 ${success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
    adminMessage.textContent = text;
    adminMessage.hidden = false;
  };

  const formatMovieCard = (movie: any) => {
    return `
      <div class="rounded-2xl border border-gray-200 bg-white p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-semibold text-gray-900">${movie.title}</p>
            <p class="text-sm text-gray-600">Director: ${movie.director}</p>
            <p class="text-sm text-gray-500">Submitted by: ${movie.submitted_by || 'Anonymous'}</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Submitted</span>
        </div>
      </div>
    `;
  };

  const formatResultCard = (movie: any) => {
    return `
      <div class="rounded-2xl border border-gray-200 bg-white p-4">
        <p class="font-semibold text-gray-900">${movie.title}</p>
        <p class="text-sm text-gray-600">Director: ${movie.director}</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Votes: ${movie.vote_count}</div>
          <div class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Story: ${movie.avg_story ?? 'N/A'}</div>
          <div class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Characters: ${movie.avg_characters ?? 'N/A'}</div>
          <div class="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Cinema: ${movie.avg_cinematography ?? 'N/A'}</div>
        </div>
        <p class="mt-3 text-sm text-slate-700">Overall: ${movie.avg_overall ?? 'N/A'}</p>
      </div>
    `;
  };

  const refreshStatus = async () => {
    try {
      const [statusResponse, pendingResponse, resultsResponse] = await Promise.all([
        fetch(statusUrl),
        fetch(pendingUrl),
        fetch(resultsUrl),
      ]);

      if (!statusResponse.ok || !pendingResponse.ok || !resultsResponse.ok) {
        throw new Error('Unable to load admin data.');
      }

      const statusData = await statusResponse.json();
      const pendingData = await pendingResponse.json();
      const resultsData = await resultsResponse.json();

      const openText = statusData.submissions_open ? 'open' : 'closed';
      adminStatus.textContent = `Submissions are currently ${openText}.`;
      lockButton.textContent = statusData.submissions_open ? 'Close Submissions' : 'Open Submissions';

      if (statusData.selected_movie) {
        selectedMovie.innerHTML = `
          <p class="text-xl font-semibold text-gray-900">${statusData.selected_movie.title}</p>
          <p class="text-sm text-gray-600">Director: ${statusData.selected_movie.director}</p>
          <p class="mt-2 text-sm text-gray-500">Selected for tonight's watch.</p>
        `;
      } else {
        selectedMovie.innerHTML = `<p class="text-gray-600">No movie has been selected yet.</p>`;
      }

      if (pendingData.length === 0) {
        pendingList.innerHTML = '<p class="text-sm text-gray-600">No pending submissions.</p>';
      } else {
        pendingList.innerHTML = pendingData.map(formatMovieCard).join('');
      }

      if (resultsData.length === 0) {
        resultsList.innerHTML = '<p class="text-sm text-gray-600">No watched movie results available yet.</p>';
      } else {
        resultsList.innerHTML = resultsData.map(formatResultCard).join('');
      }
    } catch (error) {
      showAdminMessage((error as Error).message, false);
    }
  };

  rollButton.addEventListener('click', async () => {
    rollButton.disabled = true;
    rollButton.textContent = 'Rolling...';
    adminMessage.hidden = true;

    try {
      const response = await fetch(rollUrl, { method: 'POST' });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || 'Unable to roll a movie.');
      }
      const movie = await response.json();
      showAdminMessage(`Selected ${movie.title} by ${movie.director} for tonight.`, true);
      refreshStatus();
    } catch (error) {
      showAdminMessage((error as Error).message, false);
    } finally {
      rollButton.disabled = false;
      rollButton.textContent = 'Roll Next Movie';
    }
  });

  lockButton.addEventListener('click', async () => {
    lockButton.disabled = true;
    adminMessage.hidden = true;
    const open = lockButton.textContent.includes('Open');

    try {
      const response = await fetch(lockUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || 'Unable to update submission lock.');
      }
      const result = await response.json();
      const action = result.submissions_open ? 'opened' : 'closed';
      showAdminMessage(`Submissions are now ${action}.`, true);
      refreshStatus();
    } catch (error) {
      showAdminMessage((error as Error).message, false);
    } finally {
      lockButton.disabled = false;
    }
  });

  resetButton.addEventListener('click', async () => {
    if (!confirm('Are you sure? This will delete all movies and votes.')) return;
    resetButton.disabled = true;
    resetButton.textContent = 'Resetting...';
    adminMessage.hidden = true;

    try {
      const response = await fetch(resetUrl, { method: 'POST' });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || 'Unable to reset contest.');
      }
      const result = await response.json();
      showAdminMessage(result.message, true);
      refreshStatus();
    } catch (error) {
      showAdminMessage((error as Error).message, false);
    } finally {
      resetButton.disabled = false;
      resetButton.textContent = 'Reset Contest';
    }
  });

  refreshStatus();
}

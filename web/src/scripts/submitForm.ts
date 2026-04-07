const API_BASE = 'http://127.0.0.1:8000/api';

export function initSubmitForm() {
  const form = document.getElementById('submit-form') as HTMLFormElement;
  const message = document.getElementById('submit-message') as HTMLElement;
  const button = document.getElementById('submit-button') as HTMLButtonElement;

  const showMessage = (text: string, success = true) => {
    message.className = `mt-6 rounded-xl p-4 ${success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
    message.textContent = text;
    message.hidden = false;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = 'Submitting...';
    message.hidden = true;

    const title = (document.getElementById('movie-title') as HTMLInputElement).value.trim();
    const director = (document.getElementById('movie-director') as HTMLInputElement).value.trim();
    const submitted_by = (document.getElementById('submitted-by') as HTMLInputElement).value.trim() || null;

    try {
      const response = await fetch(`${API_BASE}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, director, submitted_by }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail || 'Unable to submit movie.');
      }

      const result = await response.json();
      showMessage(`Movie submitted: ${result.title} by ${result.director}.`, true);
      form.reset();
    } catch (error) {
      showMessage((error as Error).message, false);
    } finally {
      button.disabled = false;
      button.textContent = 'Submit Movie';
    }
  });
}

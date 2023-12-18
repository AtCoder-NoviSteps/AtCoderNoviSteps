const allProblemsUrl = 'https://kenkoooo.com/atcoder/resources/problems.json';

export async function getTasks() {
  try {
    const response = await fetch(allProblemsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response.json();
  } catch (error) {
    // Handle error
    console.error('There was a problem fetching data:', error);
    throw error;
  }
}

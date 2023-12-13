const authorizeUrl = 'https://atcoder-auth.kenkoooo.com/api/authorize';
const confirmUrl = 'https://atcoder-auth.kenkoooo.com/api/confirm ';
const verifyUrl = 'https://atcoder-auth.kenkoooo.com/api/verify';

export async function authorize(username: string) {
  try {
    const postData = {
      user_id: username,
    };
    const response = await fetch(authorizeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
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

export async function confirm(username: string, secret: string) {
  try {
    const postData = {
      user_id: username,
      secret: secret,
    };
    const response = await fetch(confirmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
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

export async function verify(username: string, token: string) {
  try {
    const postData = {
      user_id: username,
      token: token,
    };
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
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

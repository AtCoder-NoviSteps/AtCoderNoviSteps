const confirmUrl = 'https://prettyhappy.sakura.ne.jp/php_curl/index.php';

import { sha256 } from '$lib/utils/hash';
import { default as db } from '$lib/server/database';

async function confirm(atcoder_username: string, atcoder_validation_code: string) {
  try {
    const url = confirmUrl + '?user=' + atcoder_username;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    const jsonData = await response.json();
    return jsonData.contents?.some((item: string) => item === atcoder_validation_code);
  } catch (error) {
    // Handle error
    console.error('There was a problem fetching data:', error);
    throw error;
  }
}

export async function generate(username: string, atcoder_username: string) {
  //ハッシュを作る
  const date = new Date().toISOString();
  const validationCode = await sha256(username + date);
  console.log(username + validationCode);

  try {
    const user = await db.user.update({
      where: {
        username: username,
      },
      data: {
        atcoder_username: atcoder_username,
        atcoder_validation_code: validationCode,
        atcoder_validation_status: false,
      },
    });
    return user.atcoder_validation_code;
  } catch (e) {
    console.log('Cant generate token');
  }
}

export async function validate(username: string) {
  try {
    const user = await db.user.findUniqueOrThrow({
      where: {
        username: username,
      },
    });

    console.log(user);
    const confirmResult = await confirm(user.atcoder_username, user.atcoder_validation_code);
    console.log(user, confirmResult);

    if (confirmResult) {
      await db.user.update({
        where: {
          username: username,
        },
        data: {
          //atcoder_username: atcoder_username,
          atcoder_validation_code: '',
          atcoder_validation_status: true,
        },
      });
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log('Cant validate user');
  }
}

export async function reset(username: string) {
  try {
    await db.user.update({
      where: {
        username: username,
      },
      data: {
        atcoder_username: '',
        atcoder_validation_code: '',
        atcoder_validation_status: false,
      },
    });
    return true;
  } catch (e) {
    console.log('Cant update user');
  }
}

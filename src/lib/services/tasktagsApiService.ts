const allTaskTagsUrl =
  'https://script.google.com/macros/s/AKfycbxnluTPGjI0MNEcxIAHeaXPEV8oCp_LQsueC57T10bB1CyY63a5irSz5u4LxSf43ODL/exec?sheetname=all_tags';

export async function getTaskTags() {
  try {
    const response = await fetch(allTaskTagsUrl, {
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

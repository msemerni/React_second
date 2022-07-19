const url = "https://swapi.dev/api/people/10";

const fetchData = async (url) => {
    if (!url) {
      console.log('Url is missed');
      return;
    }
  
    try {
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
    }
  };

fetchData(url);

function someFunc (someProp) {
    console.log("someProp:", someProp);
}

someFunc("qwerty");

$(document).ready(function () {
  // Global variables
  const apiKey = "101f02d3339d6db57b6cce974ad63239";

  // Container for the five day forecast object array
  let forecastArray = [];

  // Current Day
  const currentDay = new Date().getDate();

  function getForecasts(city) {
    const coordFetchUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
    fetch(coordFetchUrl)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        // Takes coordinates from parsed response and builds the URL for the next fetch, using those coords
        if (data.length) {
          const cityLat = data[0].lat;
          const cityLon = data[0].lon;
          const currentFetchUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${cityLat}&lon=${cityLon}&units=imperial&appid=${apiKey}`;
          const fiveDayFetchUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${cityLat}&lon=${cityLon}&units=imperial&appid=${apiKey}`;

          // Calls the second fetch function, which will return all the necessary data bits to fill out the HTML elements
          getWeatherFields(currentFetchUrl, fiveDayFetchUrl);
        } else {
          // Shows a 'no results' message if search came up empty (i.e. badly typo-ed, un-autocomplet-able input)
          $("#currentWeather").append(
            $("<p>").text("No results found, please try again")
          );
        }
      })
      .catch(function (error) {
        emptyContainers();
        $("#currentWeather").append(
          $("<p>").text(`Hmm.. something went wrong \n ${error.message}`)
        );
      });
  }

  //  takes in currentFetchUrl and fiveDayFetchUrl, formats the info, and saves them to storage
  function getWeatherFields(currentUrl, fiveDayUrl) {
    fetch(currentUrl)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        const currentWeatherObject = {
          city: `${data.name}`,
          date: convertTenDigitDate(data.dt),
          icon: {
            url: `https://openweathermap.org/img/w/${data.weather[0].icon}.png`,
            alt: `${data.weather[0].main}`,
          },
          temp: `Temp: ${data.main.temp} \u00B0F`,
          wind: `Wind: ${data.wind.speed} MPH`,
          humidity: `Humidity: ${data.main.humidity}%`,
        };
        buildCurrent(currentWeatherObject);
        setStorage(currentWeatherObject.city);
      })
      .catch(function (error) {
        emptyContainers();
        $("#currentWeather").append(
          $("<p>").text(`Hmm.. something went wrong \n ${error.message}`)
        );
      });

    fetch(fiveDayUrl)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let startIndex = 0;
        for (let elem of data.list) {
          elemDay = reformatDate(elem.dt_txt).split("/")[1];
          if (elemDay == currentDay + 1) {
            break;
          }
          startIndex++;
        }
        for (let i = startIndex + 4; i < 40; i += 8) {
          const properIcon = formatIcon(data.list[i].weather[0].icon);
          const weatherObject = {
            city: `${data.city.name}`,
            date: reformatDate(data.list[i].dt_txt),
            icon: {
              url: `https://openweathermap.org/img/w/${properIcon}.png`,
              alt: `${data.list[i].weather[0].main}`,
            },
            temp: `Temp: ${data.list[i].main.temp} \u00B0F`,
            wind: `Wind: ${data.list[i].wind.speed} MPH`,
            humidity: `Humidity: ${data.list[i].main.humidity}%`,
          };
          forecastArray.push(weatherObject);
        }
        buildFiveDay(forecastArray);
      })
      .catch(function (error) {
        emptyContainers();
        $("#currentWeather").append(
          $("<p>").text(`Hmm.. something went wrong.. \n ${error.message}`)
        );
      });
  }

  // takes in currentWeatherObject, renders the elements of the current forecast
  function buildCurrent(object) {
    const cityDate = $("<h2>")
      .addClass(`mb-3 d-inline`)
      .text(`${object.city} (${object.date})`);
    const icon = $("<img>")
      .addClass(`mb-3 d-inline-block px-2`)
      .attr({ src: object.icon.url, alt: object.icon.alt });
    const tempEl = $("<p>").text(object.temp);
    const windEl = $("<p>").text(object.wind);
    const humidityEl = $("<p>").text(object.humidity);
    $("#currentWeather")
      .addClass("border border-primary")
      .append(cityDate, icon, tempEl, windEl, humidityEl);
  }

  //   takes in forecastArray and populates it to page
  function buildFiveDay(objArray) {
    document.getElementById("fiveDayLabel").hidden = false;
    for (let o of objArray) {
      const dayCard = $("<div>").addClass(
        "card col-lg-2 col-md-3 col-sm-4 m-3 bg-primary"
      );
      const cardBody = $("<div>").addClass("card-body p-1");

      dayCard.append(cardBody);

      const date = $("<h4>").addClass(`card-title`).text(o.date);
      const icon = $("<img>").attr({ src: o.icon.url, alt: o.icon.alt });
      const tempEl = $("<p>").addClass(`card-text`).text(o.temp);
      const windEl = $("<p>").addClass(`card-text`).text(o.wind);
      const humidityEl = $("<p>").addClass(`card-text`).text(o.humidity);

      cardBody.append(date, icon, tempEl, windEl, humidityEl);

      $("#cardsContainer").append(dayCard);
    }
  }

  // populates to the search history
  function addToSearchList(cityString) {
    const cityListEl = $("<li>")
      .text(cityString)
      .addClass("history-item w-100 p-2 text-center m-1 rounded");
    $("#searchHistory").append(cityListEl);
  }

  //  saves to local storage
  function setStorage(cityString) {
    const storageArray = JSON.parse(localStorage.getItem("history"));
    if (!storageArray) {
      localStorage.setItem("history", JSON.stringify([cityString]));
      addToSearchList(cityString);
    } else {
      if (!storageArray.includes(cityString)) {
        storageArray.push(cityString);
        localStorage.setItem("history", JSON.stringify(storageArray));
        addToSearchList(cityString);
      }
    }
  }

  //   populates the stored list of cities from search history
  function getStorage() {
    const storageArray = JSON.parse(localStorage.getItem("history"));
    if (storageArray) {
      for (city of storageArray) {
        addToSearchList(city);
      }
    }
  }

// reformats date
  function reformatDate(dateField) {
    const dateArray = dateField.split(" ")[0].split("-");
    return `${dateArray[1]}/${dateArray[2]}/${dateArray[0]}`;
  }

  // reformats time to readable format
  function convertTenDigitDate(timestamp) {
    const pubDate = new Date(timestamp * 1000);
    const twoDigitDay =
      pubDate.getDate().toString().length === 1
        ? `0${pubDate.getDate()}`
        : pubDate.getDate();
    const formattedDate = `${
      pubDate.getMonth() + 1
    }/${twoDigitDay}/${pubDate.getFullYear()}`;
    return formattedDate;
  }

  // pulls state from user input
  function cityOnly(string) {
    let result = string;
    if (string.includes(",")) {
      result = string.split(",")[0];
    }
    return result;
  }
  // sets day/night icon
  function formatIcon(string) {
    let stringArray = string.split("");
    stringArray[stringArray.length - 1] = "d";
    const result = stringArray.join("");
    return result;
  }

  // empties containers for 5 day forecast
  function emptyContainers() {
    forecastArray = [];
    $("#cardsContainer, #currentWeather").empty();
  }

  // Load persisted search history into the list
  getStorage();

  // Event listeners

  // City search (form submission)
  $("#searchForm").submit(function (event) {
    event.preventDefault();
    emptyContainers();
    const searchedVal = $("#citySearch").val();
    const searchCity = cityOnly(searchedVal);
    getForecasts(searchCity);
    $("#citySearch").val("");
  });

  // City search (clicked item in search history)
  $("#searchHistory").click(function (event) {
    const clickedEl = event.target;
    if (clickedEl.matches(".history-item")) {
      emptyContainers();
      getForecasts(clickedEl.innerText);
    }
  });
});

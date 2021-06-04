const fetch = require("node-fetch");
``
const get = (url) => {
    return fetch(url);
}

class Weather {
    async getWeather(cityName) {
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=fcaf4adc63bebb9e0b7e7d29ac2eb5ab&lang=vi&units=metric`;
        return get(url).then(function(response) {
            return response.json();
          }).then(function(data) {
            return processInfo(data);
          }).catch(function() {
            return 'Không tìm thấy thông tin thành phố.';
        });
    }
}

processInfo = (data) => {
    console.log('Process infor');
    let message = `${data.name}, ${data.sys.country}. Hôm nay trời có `;
    if(data.weather && data.weather.length > 1) {
        data.weather.forEach((element, index) => {
            message += element.description;
            if(index === data.weather.length - 1) {
                message += '.'
            } else {
                message += ', '
            }
        });
    } else {
        message +=  data.weather[0].description + '. ';
    }
    message += `Nhiệt độ ${data.main.temp} độ C, cảm giác như ${data.main.feels_like}. Nhiệt độ cao nhất ${data.main.temp_max} độ C, nhiệt độ thấp nhất ${data.main.temp_min} độ C.`
    return message;
}

module.exports = Weather;
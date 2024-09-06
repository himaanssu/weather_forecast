import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const api_key = process.env.API_KEY;

// Default route for rendering the main page without forecast data
app.get('/', (req, res) => {
    res.render("index.ejs", { forecast: 0 });
});

// Route for handling weather search requests
app.get("/weather", async (req, res) => {
    try {
        const location = req.query.location;
        let response;

        if (/^\d+$/.test(location)) {
            response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?zip=${location},IN&units=metric&appid=${api_key}`);
        } else {
            response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${api_key}`);
        }

        const forecastData = response.data.list;
        const city = response.data.city.name;
        const country = response.data.city.country;

        // Overall Forecast (First Carousel Item)
        const overallForecast = {
            temperature: Math.round(forecastData[0].main.temp),
            city: city,
            country: country,
            icon: `http://openweathermap.org/img/wn/${forecastData[0].weather[0].icon}@2x.png`,
            main: forecastData[0].weather[0].main,
            precipitation: Math.round(forecastData[0].pop * 100) + '%', // Round to nearest integer
            humidity: forecastData[0].main.humidity + '%', // Humidity percentage
            wind: forecastData[0].wind.speed + ' km/h' // Wind speed in km/h
        };

        // Hourly Forecast (Second Carousel Item)
        const hourlyForecast = forecastData.slice(0, 5).map(item => {
            return {
                temperature: Math.round(item.main.temp),
                time: new Date(item.dt_txt).getHours() + ":00",
                period: new Date(item.dt_txt).getHours() >= 12 ? 'PM' : 'AM',
                icon: `http://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                description: item.weather[0].description,
            };
        });

        // Five-Day Forecast (Third Carousel Item)
        const fiveDayForecast = [];
        for (let i = 0; i < forecastData.length; i += 8) {
            const dayData = forecastData[i];
            fiveDayForecast.push({
                temperature: Math.round(dayData.main.temp),
                day: new Date(dayData.dt_txt).toLocaleDateString('en-US', { weekday: 'short' }),
                icon: `http://openweathermap.org/img/wn/${dayData.weather[0].icon}.png`,
                description: dayData.weather[0].description,
            });
        }

        const forecast = [
            overallForecast,
            { hourly: hourlyForecast },
            { fiveDay: fiveDayForecast }
        ];

        res.render("index.ejs", { forecast });
    } catch (error) {
        console.error("Error fetching weather forecast:", error);
        res.render("index.ejs", { forecast: null });
    }
});

app.listen(port, () => {
    console.log(`Running server on port: ${port}.`);
});

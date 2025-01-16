interface Logger {
    meta: ImportMeta,
    process: string,
    chalkInstace?: ChalkInstance,
    log(message: string): void,
    logError(error: any): void
}

type Command = {
    data: SlashCommandBuilder;
    execute(interaction: CommandInteraction): Promise<void>;
}

type Timelines = {
    daily: Array<{
        time: string;
        values: {
            cloudBaseAvg: number;
            cloudBaseMax: number;
            cloudBaseMin: number;
            cloudCeilingAvg: number;
            cloudCeilingMax: number;
            cloudCeilingMin: number;
            cloudCoverAvg: number;
            cloudCoverMax: number;
            cloudCoverMin: number;
            dewPointAvg: number;
            dewPointMax: number;
            dewPointMin: number;
            evapotranspirationAvg: number;
            evapotranspirationMax: number;
            evapotranspirationMin: number;
            evapotranspirationSum: number;
            freezingRainIntensityAvg: number;
            freezingRainIntensityMax: number;
            freezingRainIntensityMin: number;
            hailProbabilityAvg: number;
            hailProbabilityMax: number;
            hailProbabilityMin: number;
            hailSizeAvg: number;
            hailSizeMax: number;
            hailSizeMin: number;
            humidityAvg: number;
            humidityMax: number;
            humidityMin: number;
            iceAccumulationAvg: number;
            iceAccumulationLweAvg: number;
            iceAccumulationLweMax: number;
            iceAccumulationLweMin: number;
            iceAccumulationLweSum: number;
            iceAccumulationMax: number;
            iceAccumulationMin: number;
            iceAccumulationSum: number;
            moonriseTime: string;
            moonsetTime: string;
            precipitationProbabilityAvg: number;
            precipitationProbabilityMax: number;
            precipitationProbabilityMin: number;
            pressureSurfaceLevelAvg: number;
            pressureSurfaceLevelMax: number;
            pressureSurfaceLevelMin: number;
            rainAccumulationAvg: number;
            rainAccumulationLweAvg: number;
            rainAccumulationLweMax: number;
            rainAccumulationLweMin: number;
            rainAccumulationMax: number;
            rainAccumulationMin: number;
            rainAccumulationSum: number;
            rainIntensityAvg: number;
            rainIntensityMax: number;
            rainIntensityMin: number;
            sleetAccumulationAvg: number;
            sleetAccumulationLweAvg: number;
            sleetAccumulationLweMax: number;
            sleetAccumulationLweMin: number;
            sleetAccumulationLweSum: number;
            sleetAccumulationMax: number;
            sleetAccumulationMin: number;
            sleetIntensityAvg: number;
            sleetIntensityMax: number;
            sleetIntensityMin: number;
            snowAccumulationAvg: number;
            snowAccumulationLweAvg: number;
            snowAccumulationLweMax: number;
            snowAccumulationLweMin: number;
            snowAccumulationLweSum: number;
            snowAccumulationMax: number;
            snowAccumulationMin: number;
            snowAccumulationSum: number;
            snowDepthAvg: number;
            snowDepthMax: number;
            snowDepthMin: number;
            snowDepthSum: number;
            snowIntensityAvg: number;
            snowIntensityMax: number;
            snowIntensityMin: number;
            sunriseTime: string;
            sunsetTime: string;
            temperatureApparentAvg: number;
            temperatureApparentMax: number;
            temperatureApparentMin: number;
            temperatureAvg: number;
            temperatureMax: number;
            temperatureMin: number;
            uvHealthConcernAvg: number;
            uvHealthConcernMax: number;
            uvHealthConcernMin: number;
            uvIndexAvg: number;
            uvIndexMax: number;
            uvIndexMin: number;
            visibilityAvg: number;
            visibilityMax: number;
            visibilityMin: number;
            weatherCodeMax: number;
            weatherCodeMin: number;
            windDirectionAvg: number;
            windGustAvg: number;
            windGustMax: number;
            windGustMin: number;
            windSpeedAvg: number;
            windSpeedMax: number;
            windSpeedMin: number;
        };
    }>;
    hourly: Array<{
        time: string;
        values: {
            cloudBase: number;
            cloudCeiling: number;
            cloudCover: number;
            dewPoint: number;
            evapotranspiration: number;
            freezingRainIntensity: number;
            hailProbability: number;
            hailSize: number;
            humidity: number;
            iceAccumulation: number;
            iceAccumulationLwe: number;
            moonPhase: number;
            precipitationIntensity: number;
            precipitationProbability: number;
            pressureSurfaceLevel: number;
            rainAccumulation: number;
            rainAccumulationLwe: number;
            rainIntensity: number;
            sleetAccumulation: number;
            sleetAccumulationLwe: number;
            sleetIntensity: number;
            snowAccumulation: number;
            snowAccumulationLwe: number;
            snowDepth: number;
            snowIntensity: number;
            temperatureApparent: number;
            temperature: number;
            uvHealthConcern: number;
            uvIndex: number;
            visibility: number;
            weatherCode: number;
            windDirection: number;
            windGust: number;
            windSpeed: number;
        };
    }>;
};

type Location = {
    lat: number;
    lon: number;
};

type WeatherResponse = {
    timelines: Timelines;
    location: Location;
};
import axios from 'axios';

const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

export const getSeasonResults = async (year: number) => {
  const response = await axios.get(`${BASE_URL}/${year}/results.json?limit=1000`);
  return response.data.MRData.RaceTable.Races;
};

export const getDriverStandings = async (year: number) => {
  const response = await axios.get(`${BASE_URL}/${year}/driverStandings.json`);
  return response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
};

export const getConstructorStandings = async (year: number | string) => {
  const response = await axios.get(`${BASE_URL}/${year}/constructorStandings.json`);
  return response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
};

export const getDrivers = async () => {
  const response = await axios.get(`${BASE_URL}/drivers.json?limit=1000`);
  return response.data.MRData.DriverTable.Drivers;
};

export const getCircuits = async () => {
  const response = await axios.get(`${BASE_URL}/circuits.json?limit=1000`);
  return response.data.MRData.CircuitTable.Circuits;
};

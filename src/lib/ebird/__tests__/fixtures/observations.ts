export const validObservation = {
  speciesCode: "varthr",
  comName: "Varied Thrush",
  sciName: "Ixoreus naevius",
  locId: "L123456",
  locName: "Tilden Regional Park",
  obsDt: "2026-02-20 08:30",
  howMany: 2,
  lat: 37.905,
  lng: -122.244,
  obsValid: true,
  obsReviewed: false,
  locationPrivate: false,
  subId: "S123456789",
};

export const validObservationMinimal = {
  speciesCode: "lewwoo",
  comName: "Lewis's Woodpecker",
  sciName: "Melanerpes lewis",
  locId: "L789012",
  locName: "Briones Regional Park",
  obsDt: "2026-02-18 14:00",
  lat: 37.922,
  lng: -122.112,
  obsValid: true,
  obsReviewed: true,
  locationPrivate: false,
};

export const validObservationArray = [validObservation, validObservationMinimal];

import * as satellite from 'satellite.js';

export interface SatelliteInfo {
    id: string;
    name: string;
    satrec: satellite.SatRec;
    color: string;
    visible: boolean;
    group: string;
}

export interface SatellitePosition {
    name: string;
    latitude: number;
    longitude: number;
    altitudeKm: number;
    velocityKmS: number;
}

/**
 * Generates a random bright color
 */
export const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 65%)`; // Bright pastel colors
};

/**
 * Parses raw TLE string into a list of satellite records
 * @param tleData Raw TLE 3-line string (Name, Line1, Line2)
 * @param groupName Category/Group name for these satellites
 * @param defaultColor Optional color for all parsed satellites, random if omitted
 * @returns Array of parsed satellites
 */
export const parseTLE = (tleData: string, groupName: string = 'Custom', defaultColor?: string): SatelliteInfo[] => {
    const lines = tleData.trim().split('\n');
    const satellites: SatelliteInfo[] = [];

    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 < lines.length) {
            const name = lines[i].trim();
            const tleLine1 = lines[i + 1].trim();
            const tleLine2 = lines[i + 2].trim();

            const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
            satellites.push({
                id: `${groupName}_${name.replace(/\s+/g, '_')}_${i}`,
                name,
                satrec,
                color: defaultColor || getRandomColor(),
                visible: true,
                group: groupName
            });
        }
    }

    return satellites;
};

/**
 * Computes current position of a satellite based on the SatRec data
 * @param satInfo The parsed satellite info
 * @param date The Date object to calculate for (default is now)
 * @returns Computed metrics: Lat, Lon, Alt, Velocity
 */
export const computeSatellitePosition = (satInfo: SatelliteInfo, date: Date = new Date()): SatellitePosition | null => {
    const positionAndVelocity = satellite.propagate(satInfo.satrec, date);

    // satellite.propagate may return a boolean if calculation fails, or an object if it succeeds.
    // Unfortunately the types sometimes do not reflect this correctly or strictly.
    if (!positionAndVelocity || typeof positionAndVelocity === 'boolean') {
        return null;
    }

    // The position_velocity result is a key-value pair of ECI coordinates.
    // These are the base results from which all other coordinates are derived.
    const positionEci = (positionAndVelocity as any).position;
    const velocityEci = (positionAndVelocity as any).velocity;

    if (typeof positionEci === 'boolean' || typeof velocityEci === 'boolean' || !positionEci || !velocityEci) {
        return null; // Calculation failed
    }

    // You will need GMST for some of the coordinate transforms.
    // http://en.wikipedia.org/wiki/Sidereal_time#Greenwich_apparent_sidereal_time
    const gmst = satellite.gstime(date);

    // Get geographic coordinates (latitude, longitude, altitude)
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    // Geodetic coords are accessed via `longitude`, `latitude`, `height`.
    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const altitudeKm = positionGd.height;

    // Calculate speed (magnitude of velocity vector)
    // velocity units are usually km/s
    const speed = Math.sqrt(
        Math.pow(velocityEci.x, 2) +
        Math.pow(velocityEci.y, 2) +
        Math.pow(velocityEci.z, 2)
    );

    return {
        name: satInfo.name,
        latitude,
        longitude,
        altitudeKm,
        velocityKmS: speed
    };
};

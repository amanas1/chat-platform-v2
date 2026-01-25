
import { RadioStation } from "../types";

export const isAiAvailable = (): boolean => {
    // AI is disabled to fix build issues
    return false;
};

export const curateStationList = async (
    stations: RadioStation[],
    category: string,
    description: string
): Promise<string[]> => {
    // Pass-through: Return original list without AI curation
    return stations.map(s => s.stationuuid);
};

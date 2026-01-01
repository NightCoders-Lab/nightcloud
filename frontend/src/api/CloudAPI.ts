import { api } from "@/lib/axios";
import { cloudStatsSchema, type CloudStatsType } from "@/types";
import validateApiRes from "@/utils/validateApiRes";
import { isAxiosError } from "axios";

/**
 * @description Obtener las estadísticas de la nube
 * @returns {Promise<CloudStatsType>} Estadísticas de la nube
 */
export async function getCloudStats(): Promise<CloudStatsType> {
  try {
    const { data } = await api.get("/cloud/stats");
    const apiRes = cloudStatsSchema.safeParse(validateApiRes(data).data);

    if (apiRes.success) {
      return apiRes.data;
    } else {
      throw new Error("Error al obtener las estadísticas de la nube");
    }
  } catch (err) {
    if (isAxiosError(err) && err.response) {
      throw new Error(err.response.data.error.message);
    } else throw err;
  }
}

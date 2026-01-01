import { apiResponseSchema } from "@/types";

/**
 * @description Valida la respuesta de la API utilizando un esquema predefinido.
 * @param data - Los datos de la respuesta de la API a validar.
 * @returns Los datos validados si la validación es exitosa.
 */
export default function validateApiRes(data: unknown) {
  // Validar la respuesta de la API usando el esquema definido
  const result = apiResponseSchema.safeParse(data);

  // Manejar errores de validación
  if (!result.success) {
    throw new Error("Error al comunicarse con el servidor");
  }

  // Manejar errores de la API
  if (!result.data.ok)
    throw new Error(
      result.data.error?.message || "Error desconocido del servidor"
    );

  // Retornar los datos validados
  return result.data;
}

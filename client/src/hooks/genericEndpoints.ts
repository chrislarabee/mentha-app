import { axiosInstance } from "./endpoints";
import * as yup from "yup";

export type BaseEndpoint = "categories";

export async function getRecord<T>(
  id: string,
  base: BaseEndpoint,
  schema: yup.Schema
): Promise<T> {
  const resp = await axiosInstance.get(`/${base}/${id}`, {});
  try {
    const record = await schema.validate(resp.data);
    return record;
  } catch (e) {
    console.log(e);
    throw new Error();
  }
}

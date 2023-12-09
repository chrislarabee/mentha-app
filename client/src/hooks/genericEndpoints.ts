import { PagedResults } from "@/schemas/shared";
import { axiosInstance } from "./endpoints";
import * as yup from "yup";

export type BaseEndpoint =
  | "categories"
  | "institutions"
  | "accounts"
  | "transactions";

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

export async function getRecordsByOwner<T>(
  ownerId: string,
  base: BaseEndpoint,
  schema: yup.Schema,
  page: number = 1,
  pageSize: number = 50
): Promise<PagedResults<T>> {
  const resp = await axiosInstance.post(
    `/${base}/by-owner/${ownerId}`,
    {},
    {
      params: { page, pageSize },
    }
  );
  const results = await schema.validate(resp.data);
  return results;
}

export async function updateRecord<T extends { id?: string | null }>(
  data: T,
  base: BaseEndpoint
  //   schema: yup.Schema
) {
  let url = `/${base}/`;
  let method = axiosInstance.post;
  if (data.id) {
    method = axiosInstance.put;
  }
  await method(`${url}${data.id || ""}`, data, {});
}

export async function deleteRecord(id: string, base: BaseEndpoint) {
  const resp = await axiosInstance.delete(`/${base}/${id}`, {});
  return resp.status === 204;
}

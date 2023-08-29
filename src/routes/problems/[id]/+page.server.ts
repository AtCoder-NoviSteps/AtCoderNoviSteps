import { error } from '@sveltejs/kit';
import { tasks } from '../sample_data';
import { NOT_FOUND } from '$lib/constants/http-response-status-codes';

// TODO: Enable to fetch data from the database via API.
export function load({ params }) {
  const task = tasks.find((task) => task.id === params.id);

  if (!task) throw error(NOT_FOUND);

  return { task };
}

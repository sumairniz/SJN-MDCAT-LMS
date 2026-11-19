'use strict';

// Read every revision-linked MCQ from PostgREST, which commonly caps
// responses at 1000 rows. A partial page is the only success terminator.
async function readAllPublishedMcqs(db, pageSize = 1000, maximum = 100000) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000)
    throw new TypeError('Invalid MCQ page size');
  const all = [];
  let lastId = 0;
  for (let offset = 0; offset < maximum; offset += pageSize) {
    const { data, error } = await db.from('mcqs').select('*')
      .order('id', { ascending: true }).range(offset, offset + pageSize - 1);
    if (error || !Array.isArray(data))
      throw new Error('MCQ page could not be verified');
    for (const record of data) {
      const id = Number(record.id);
      if (!Number.isSafeInteger(id) || id <= lastId)
        throw new Error('MCQ pagination has missing or repeated order');
      lastId = id;
      all.push(record);
    }
    if (data.length < pageSize) return all;
  }
  throw new Error('MCQ catalog exceeds verified pagination limit');
}
module.exports = { readAllPublishedMcqs };

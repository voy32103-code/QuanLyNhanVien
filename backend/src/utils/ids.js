const sequenceMap = {
  employees: {
    prefix: "NV",
    sequence: "employee_text_id_seq"
  },
  service_requests: {
    prefix: "YC",
    sequence: "service_request_text_id_seq"
  }
};

async function nextTextId(client, table, prefix) {
  const config = sequenceMap[table];

  if (!config) {
    throw new Error(`Unsupported id table: ${table}`);
  }

  if (prefix !== config.prefix) {
    throw new Error(`Unsupported id prefix: ${prefix}`);
  }

  const result = await client.query(`SELECT nextval('${config.sequence}')::bigint AS next_id`);
  const nextId = Number(result.rows[0].next_id);

  return `${prefix}${String(nextId).padStart(3, "0")}`;
}

module.exports = {
  nextTextId
};

export const ok = (data: any) => ({
  statusCode: 200,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
  body: JSON.stringify(data),
});

export const err = (status: number, message: string) => ({
  statusCode: status,
  headers: { 
    'Content-Type': 'application/json', 
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
  body: JSON.stringify({ error: message }),
});

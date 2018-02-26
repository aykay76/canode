Need much, much more information here but for now i'll document the API as I create it.

All API calls are made using the same Uri with the route and parameters passed as a
JSON object in the request body

Uri: http://host:port/
Body:
{
  "module": "ca",
  "method": "create",
  "name": "new CA",
  "subject": "C=GB,ST=England,O=Organisation,OU=Team,CN=Project Root CA"
}

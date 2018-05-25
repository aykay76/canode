canode is a Publick Key Infrastructure (PKI) Certificate Authority (CA) implemented in JavaScript, running in Node.js, interfacing to OpenSSL. It provides a HTTP API to perform standard functions in OpenSSL to create and maintain a certificate authority and associated certificates.

It is currently MVP quality - it performs the bare minimum functions to get a CA up and running to issue certificates.

The supported functions are listed below. Each function is invoked by POSTing a command block to the server:

POST http://localhost:8443/

where the body contains a JSON formatted object which identifies the action and any parameters required by the server to successfully carry out that action.

#CACreate
When creating a new CA it uses the structure of Organisation/Team/Product to identify a distinct authority. This way consumers can create separate CAs for different products, environment levels, teams and organisations. This should suit the needs of most people - I could extend this to be configurable but trying to keep it simple right now.

Body:
{
	"action": "ca-create",
	"organisation": "testOrg",
	"team": "testTeam",
	"product": "testProduct"
}

The operation creates a folder structure for the CA, a root certificate and an intermediate certificate, a CRL. It then returns the root and intermediate certificates so that they can be stored in the relevant certificate store/cert-chain for the consumer.

# CAGet
This simply returns the root certificate and intermediate certificate as above, without the creation parts of the operation.

Body:
{
  "action": "ca-get",
  "organisation": "testOrg",
  "team": "testTeam",
  "product": "testProduct"
}

TODO: To be more RESTful this should probably be re-written as GET http://localhost:844/ca/testOrg/testTeam/testProduct

# CertCreateServer
This operation creates a certificate for a server to use on TLS protected channels. The server certificate will be signed by the intermediate authority created in the CACreate operation.

Body:
{
	"action": "cert-create",
	"organisation": "testOrg",
	"team": "testTeam",
	"product": "testProduct",
	"entity": "testServer",
	"type": "server_cert"
}

entity: is the name of the server that will be put in the CN field
type: identifies the type of certificate (server or user)

TODO: support SAN (DNS for server, e-mail for user)
TODO: add support for user certificates

This will return the end entity certificate only.

# CertGet
Simply returns the identified certificate.

Body:
{
  "action": "cert-get",
  "organisation": "testOrg",
  "team": "testTeam",
  "product": "testProduct",
  "entity": "testServer"
}

# KeyCreate
Creates a RSA key pair for a specified entity and returns it.

Body:
{
  "action": "key-create",
  "organisation": "testOrg",
  "team": "testTeam",
  "product": "testProduct",
  "entity": "testServer",
  "keypass": "password"
}

If the organisation, team, product and entity are not provided then a transient keypair is created and returned.

# CSRCreate
Create a certificate signing request and return it to the consumer for further action.

Body:
{
  "action": "csr-create",
  "organisation": "testOrg",
  "team": "testTeam",
  "product": "testProduct",
  "entity": "testServer"
}

<hr/>

ToDo:
- Authentication/Authorisation, most likely using OIDC
- Custom DN format on subject/issuer
- Extensions like SAN
- Revoke certificates
- Delete CA
- OCSP interface
- Reissue certificate
- Proper documentation  :(
- Boilerplate client code

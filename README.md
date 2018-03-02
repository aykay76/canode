canode is a Publick Key Infrastructure (PKI) Certificate Authority (CA) implemented in JavaScript, running in Node.js, interfacing to OpenSSL. It provides a HTTP API to perform standard functions in OpenSSL to create and maintain a certificate authority and associated certificates.

It is currently MVP quality - it performs the bare minimum functions to get a CA up and running to issue certificates.

<hr/>

ToDo:
- Authentication/Authorisation, most likely using OIDC
- Handle multiple CAs per requesting entity
- Custom DN format on subject/issuer
- Extensions like SAN
- Revoke certificates
- Delete CA
- OCSP interface
- Reissue certificate
- Proper documentation  :(
- Boilerplate client code

This project is to create an API interface to OpenSSL for managing Certificate Authorities and the tasks associated with running a CA. My original intention was to develop my own PKI software, that's an ongoing project to learn .NET Core and may one day see the light of day. In the meantime I want to learn more about API development with Node.JS so this project exists for me to get back into JS (it's been a few years) and to learn Node.

There is no licence on this software because I don't believe many people will view it let alone wish to use it. However, if you find it useful and want to use it (or contribute to it) then great! There is no charge, no warranty and I believe no risk of breaching anyone else's IP. In short, do what you will with it but if you get into any trouble it's not my fault  :)

Microservices and loosely-coupled components are not new concepts to me, however I was doing some research to see if there were any "standards" or best practices I should follow. I quickly decided not to follow any of them and take a JFDI approach. As such I don't have a lot of structure around modules and routes right now, all actions are performed by hitting the same URL and specifying the action and parameters in the body of the POST. (I didn't mention HTTP, I'm using HTTP, probably obvious - possibly not).

My current thinking is two have two "layers" of APIs; one which exposes all the underlying OpenSSL functionality, and a high level of abstraction that provides a simple approach to CA management for those less interested in the underlying mechanics.

<hr/>

ToDo:
- Authentication/Authorisation, most likely using OIDC
- Handle multiple CAs per requesting entity
- Custom DN format on subject/issuer
- Extensions like SAN
- Delete certificates
- Delete CA
- OCSP interface
- Reissue certificate
- Proper documentation  :(
- Boilerplate client code
CERTIFICATES
     ssh-keygen supports signing of keys to produce certificates that may be
     used for user or host authentication.  Certificates consist of a public
     key, some identity information, zero or more principal (user or host)
     names and a set of options that are signed by a Certification Authority
     (CA) key.  Clients or servers may then trust only the CA key and verify
     its signature on a certificate rather than trusting many user/host keys.
     Note that OpenSSH certificates are a different, and much simpler, format
     to the X.509 certificates used in ssl(8).

     ssh-keygen supports two types of certificates: user and host.  User cer-
     tificates authenticate users to servers, whereas host certificates
     authenticate server hosts to users.  To generate a user certificate:

           $ ssh-keygen -s /path/to/ca_key -I key_id /path/to/user_key.pub

     The resultant certificate will be placed in /path/to/user_key-cert.pub.
     A host certificate requires the -h option:

           $ ssh-keygen -s /path/to/ca_key -I key_id -h /path/to/host_key.pub

     The host certificate will be output to /path/to/host_key-cert.pub.

     It is possible to sign using a CA key stored in a PKCS#11 token by pro-
     viding the token library using -D and identifying the CA key by providing
     its public half as an argument to -s:

           $ ssh-keygen -s ca_key.pub -D libpkcs11.so -I key_id user_key.pub

     Similarly, it is possible for the CA key to be hosted in a ssh-agent(1).
     This is indicated by the -U flag and, again, the CA key must be identi-
     fied by its public half.

           $ ssh-keygen -Us ca_key.pub -I key_id user_key.pub

     In all cases, key_id is a "key identifier" that is logged by the server
     when the certificate is used for authentication.

     Certificates may be limited to be valid for a set of principal
     (user/host) names.  By default, generated certificates are valid for all
     users or hosts.  To generate a certificate for a specified set of princi-
     pals:

           $ ssh-keygen -s ca_key -I key_id -n user1,user2 user_key.pub
           $ ssh-keygen -s ca_key -I key_id -h -n host.domain host_key.pub

     Additional limitations on the validity and use of user certificates may
     be specified through certificate options.  A certificate option may dis-
     able features of the SSH session, may be valid only when presented from
     particular source addresses or may force the use of a specific command.
     For a list of valid certificate options, see the documentation for the -O
     option above.

     Finally, certificates may be defined with a validity lifetime.  The -V
     option allows specification of certificate start and end times.  A cer-
     tificate that is presented at a time outside this range will not be con-
     sidered valid.  By default, certificates are valid from UNIX Epoch to the
     distant future.

     For certificates to be used for user or host authentication, the CA pub-
     lic key must be trusted by sshd(8) or ssh(1).  Please refer to those man-
     ual pages for details.

KEY REVOCATION LISTS
     ssh-keygen is able to manage OpenSSH format Key Revocation Lists (KRLs).
     These binary files specify keys or certificates to be revoked using a
     compact format, taking as little as one bit per certificate if they are
     being revoked by serial number.

     KRLs may be generated using the -k flag.  This option reads one or more
     files from the command line and generates a new KRL.  The files may
     either contain a KRL specification (see below) or public keys, listed one
     per line.  Plain public keys are revoked by listing their hash or con-
     tents in the KRL and certificates revoked by serial number or key ID (if
     the serial is zero or not available).

     Revoking keys using a KRL specification offers explicit control over the
     types of record used to revoke keys and may be used to directly revoke
     certificates by serial number or key ID without having the complete orig-
     inal certificate on hand.  A KRL specification consists of lines contain-
     ing one of the following directives followed by a colon and some direc-
     tive-specific information.

     serial: serial_number[-serial_number]
             Revokes a certificate with the specified serial number.  Serial
             numbers are 64-bit values, not including zero and may be
             expressed in decimal, hex or octal.  If two serial numbers are
             specified separated by a hyphen, then the range of serial numbers
             including and between each is revoked.  The CA key must have been
             specified on the ssh-keygen command line using the -s option.

     id: key_id
             Revokes a certificate with the specified key ID string.  The CA
             key must have been specified on the ssh-keygen command line using
             the -s option.

     key: public_key
             Revokes the specified key.  If a certificate is listed, then it
             is revoked as a plain public key.

     sha1: public_key
             Revokes the specified key by including its SHA1 hash in the KRL.

     sha256: public_key
             Revokes the specified key by including its SHA256 hash in the
             KRL.  KRLs that revoke keys by SHA256 hash are not supported by
             OpenSSH versions prior to 7.9.

     hash: fingerprint
             Revokes a key using a fingerprint hash, as obtained from a
             sshd(8) authentication log message or the ssh-keygen -l flag.
             Only SHA256 fingerprints are supported here and resultant KRLs
             are not supported by OpenSSH versions prior to 7.9.

     KRLs may be updated using the -u flag in addition to -k.  When this
     option is specified, keys listed via the command line are merged into the
     KRL, adding to those already there.

     It is also possible, given a KRL, to test whether it revokes a particular
     key (or keys).  The -Q flag will query an existing KRL, testing each key
     specified on the command line.  If any key listed on the command line has
     been revoked (or an error encountered) then ssh-keygen will exit with a
     non-zero exit status.  A zero exit status will only be returned if no key
     was revoked.


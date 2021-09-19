# Entry Pass core module
This is Entry Pass core module. This module contains cryptography stuffs (like
RSA asymmetric encryption and **modified** SHA-256 hashing function)

## About core module
Entry Pass core is the protocol that allow you to prove that you're allowed to
enter in some location.

This protocol is intended for replacing existing centralized methods by using
the power of cryptography signatures. You can have multiple passes in your
device and each pass is a signature of your personal information.

## About cryptography
Entry Pass uses ECDSA for signing passes and certficates. The certificate that
Entry Pass used is not the standard certificate and it only works within Entry
Pass protocol implementations.

Entry Pass also uses "modified" SHA hashing function (because the result doesn't
match with SHA-256, but I also don't want to keep wasting time implementing the
algorithm)

## Different type of passes
- Time limited passes: Passes that becomes invalid after specific amount of time.
  Useful if you want to temporary authorize someone
- Pernament passes: These passes are pernament, which mean it last forever

However, the passes issuer must have permissions in order to create those passes.
There're 3 permissions:
- Allow issuer to create certificates. Only grant this permission to someone you
  highly trust
- Allow issuer to create time limited passes. The expire time must be earlier or
  equals to the issuer's certificate
- Allow issuer to create pernament passes. The duration of these passes are always
  greater than issuer's certificate

## Certificates and trusts
If you trust the root certificate (the one without parent certificate), all the
children certificates are also considered to be trusted. This is somewhat similar
to SSL cerificates.

You have to trust the root certificate (not the one that has parent certificate)
to get all chldren certificates trusted.
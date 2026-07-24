import bcrypt
password = b"admin123"
hashed = b"$2b$12$fp9H8Wu0e2cQNvrXetPzUeg1n1ATh2rp.Ja3HTK.VLRxp2G7qnH.q"
try:
    print(bcrypt.checkpw(password, hashed))
except Exception as e:
    print(e)

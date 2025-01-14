import jwt from 'jsonwebtoken'; 

const verifyToken = (req, res, next) => {
  // token jest przekazywany przez w nagłówku Authorization żądania HTTP (Authorization: Bearer <token>)

  // rozdzielamy Bearer i token
  const token = req.headers['authorization']?.split(' ')[1]; 

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // weryfikacja tokenu - process.env.JWT_SECRET to sekret (klucz) używany do podpisania tokenu
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id; //decoded.id to id użytkownika w tokenie, pozwala na dalsze użycie tej informacji w dalszych czynnościach

    //jeśli wszystko okej to przechodzimy do następnej funkcji
    next();
  });
};

export default verifyToken;


//token jest używany przez posiadacza, który jest autoryzowany do wykonania określonych akcji
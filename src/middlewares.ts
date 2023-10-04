/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextFunction, Request, Response} from 'express';
import ErrorResponse from './interfaces/ErrorResponse';
import CustomError from './classes/CustomError';
import jwt from 'jsonwebtoken';
import {OutputUser} from './interfaces/User';
import userModel from './api/models/userModel';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`🔍 - Not Found - ${req.originalUrl}`, 404);
  next(error);
};

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  console.error('errorHandler', err);
  res.status(err.status || 500);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('authenticate');
    // extract bearer token from header
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader || typeof bearerHeader === 'undefined') {
      next(new CustomError('token not valid', 403));
      return;
    }

    // extract token from bearer token
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    if (!token) {
      next(new CustomError('token not valid', 403));
      return;
    }

    console.log('token', token);
    // extract user from token
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as OutputUser;
    // check that user is in database
    console.log('authenticate', user);
    const result = await userModel.findById(user.id);
    if (result) {
      console.log(user, result);
      res.locals.user = user;
      next();
    } else {
      next(new CustomError('token not valid', 403));
    }
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

export {notFound, errorHandler, authenticate};

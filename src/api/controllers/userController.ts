import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {User} from '../../interfaces/User';
import {validationResult} from 'express-validator';
import userModel from '../models/userModel';
import bcrypt from 'bcrypt';
import DBMessageResponse from '../../interfaces/DBMessageResponse';

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const user = req.body;
    console.log('postUser', user);
    user.password = await bcrypt.hash(user.password, 12);

    const newUser = await userModel.create(user);
    const response: DBMessageResponse = {
      message: 'User created',
      data: {
        username: newUser.username,
        id: newUser._id,
      },
    };

    res.json(response);
  } catch (error) {
    console.log(error);
    next(new CustomError('User creation failed', 500));
  }
};

//current user
const userPut = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    console.log('user body ', req.body);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const user = req.body;
    console.log('user body ', req.body);
    user.password = await bcrypt.hash(user.password, 12);

    const updatedUser = await userModel.findByIdAndUpdate(
      res.locals.user.id,
      user,
      {
        new: true,
      }
    );

    console.log('updated user ', updatedUser);

    if (!updatedUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    const message: DBMessageResponse = {
      message: 'User updated',
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

//admin only
const userDelete = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    if (res.locals.user.role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

    console.log(req.params.id);
    const deletedUser = await userModel.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    const message: DBMessageResponse = {
      message: 'User deleted',
      data: {
        id: deletedUser._id,
        username: deletedUser.username,
      },
    };
    res.json(message);
  } catch (error) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role -__v');
    const response: DBMessageResponse = {
      message: 'Users found',
      data: users,
    };

    res.json(response);
  } catch (error) {
    next(new CustomError('Users not found', 500));
  }
};

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role -__v');

    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }

    const response: DBMessageResponse = {
      message: 'User found',
      data: user,
    };

    res.json(response);
  } catch (error) {
    next(new CustomError('User not found', 500));
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user) {
    next(new CustomError('token not valid', 403));
  } else {
    res.json(res.locals.user);
  }
};

export {userPost, userPut, userDelete, userListGet, userGet, checkToken};

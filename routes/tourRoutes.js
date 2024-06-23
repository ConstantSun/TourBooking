const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const tourRouter = express.Router();

tourRouter.use((req, res, next) => {
  console.log('Hi from Middleware :v ');
  next();
});
tourRouter.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// tourRouter.param('id', tourController.checkTourIdValid);
tourRouter.use('/', authController.protect); // if use protect here, it means it will apply protect for all path starts with '/'

tourRouter
  .route('/')
  .get(tourController.getTours)
  .post(tourController.addTour);

tourRouter.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/:id')
  .get(tourController.getTourById)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = tourRouter;

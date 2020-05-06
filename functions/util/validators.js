//helper function to check if any required field is empy or not
const isEmpty = function (string) {
  if (string.trim() === "") {
    return true;
  } else {
    return false;
  }
};
//helper function to check if the email is a valid one or not
const isEmail = function (email) {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) {
    return true;
  } else {
    return false;
  }
};
exports.validateSignupData = function (data) {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "must not be empty !";
  } else if (!isEmail(data.email)) {
    errors.email = "must be a valid one !";
  }
  if (isEmpty(data.password)) {
    errors.password = "must not be empty !";
  }
  if (data.password !== data.confirmPassword) {
    errors.password = "passwords must match !";
  }
  if (isEmpty(data.userName)) {
    errors.userName = "must not be empty !";
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
exports.validateLoginData = function (data) {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = "must not be empty !";
  }
  if (isEmpty(data.password)) {
    errors.password = "must not be empty !";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
exports.isEmpty = isEmpty;
exports.isEmail = isEmail;
exports.reduceUserDetails = (data) => {
  let userProfileDetails = {};
  // for Bio
  if (!isEmpty(data.bio.trim())) {
    userProfileDetails.bio = data.bio;
  }
  // for website
  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userProfileDetails.website = "http://" + data.website.trim();
    } else {
      userProfileDetails = data.website;
    }
  }
  // for location
  if (!isEmpty(data.location.trim())) {
    userProfileDetails.location = data.location;
  }
  return userProfileDetails;
};

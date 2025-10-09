class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export {ApiError}

// class ApiError extends Error { ... }
// You’re creating a custom class called ApiError.
// It extends the built-in Error class, meaning it inherits normal error behavior (like message and stack).
// This allows you to add your own properties (like statusCode, success, etc.) for API-specific error responses.

// 🟩 constructor(...)
// The constructor runs whenever you create a new instance of this class.
// It takes four parameters:
// (statusCode, message = "Something went wrong", errors = [], stack = "")


// Let’s break them down 👇

// Parameter	Type	Purpose
// statusCode	number	The HTTP status code (e.g., 400, 404, 500)
// message	string	Description of the error
// errors	array	List of detailed error messages (optional)
// stack	string	Custom stack trace (optional, mostly for debugging)
// 🟩 super(message)

// Calls the parent class (Error) constructor.

// This sets the base message property that all errors have.

// Without this, your custom error wouldn’t behave like a normal JavaScript error.

// 🟩 this.statusCode = statusCode

// Stores the HTTP status code (for example: 400 for Bad Request or 500 for Server Error).

// This helps when you send an error response with res.status(error.statusCode).

// 🟩 this.data = null

// Optional field; often used to keep a consistent API structure.

// Since it’s an error, there’s no useful data, so it’s set to null.

// 🟩 this.message = message

// Stores the error message.

// Although Error already has a message property from super(message), setting it here ensures it’s accessible if someone reads it later.

// 🟩 this.success = false

// Indicates that the request failed.

// This makes API responses consistent with your success format, where successful responses usually have success: true.

// 🟩 this.errors = errors

// Stores additional detailed errors (for example, multiple validation errors).

// Useful for showing multiple issues in one response:

// {
//   "success": false,
//   "errors": ["Email is invalid", "Password too short"]
// }

// 🟩 Stack trace handling
// if (stack) {
//   this.stack = stack;
// } else {
//   Error.captureStackTrace(this, this.constructor);
// }


// The stack trace helps identify where the error originated.

// If a stack is provided manually, it uses that.

// Otherwise, Error.captureStackTrace() automatically captures it (Node.js built-in feature).
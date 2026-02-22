import { appError } from "./appError"


export class BadRequestError extends appError {
	constructor(message = "Bad Request") {
		super(message, 400)

	}
}



// Unauthorized Error 

export class UnauthorizedError extends appError {
	constructor(message = "Unauthorized") {
		super(message, 401)

	}
}


// Forbidden 


export class ForbiddenError extends appError {
	constructor(message = "Forbidden") {
		super(message, 403)

	}
}




// Not Found

export class NotFoundError extends appError {
	constructor(message = "Not Found") {
		super(message, 404)
	}
}


// 409 Conflict
export class ConflictError extends appError {
	constructor(message = "Conflict") {
		super(message, 409)
	}
}

// 500 Internal Server Error
export class InternalServerError extends appError {
	constructor(message = "Internal Server Error") {
		super(message, 500)
	}
}




// 429 TooManyRequestsError
export class TooManyRequestsError extends appError {
	constructor(message = "To Many Request ") {
		super(message, 429)
	}
}



// -------------------- UNDER THE HOOD EXPLANATION --------------------
/*
1. `TooManyRequestsError` extends our custom `appError`, which itself extends
   JavaScript's built-in `Error` class. This forms an inheritance chain:
   TooManyRequestsError → appError → Error.

2. When you create a new instance, e.g.
     throw new TooManyRequestsError("Rate limit exceeded")
   the constructor of `TooManyRequestsError` runs first.

3. Inside that constructor, `super(message, 429)` calls the parent constructor
   (appError), passing along the message and HTTP status code.

4. The `appError` constructor then:
     - Calls `super(message)` → initializes the native Error class
       with the given message so it appears in stack traces.
     - Sets `this.statusCode = 429` → attaches the HTTP code to the instance.
     - Sets `this.isOperational = true` → marks it as a handled, predictable error.
     - Runs `Error.captureStackTrace(this, this.constructor)` to remove the
       constructor from the stack trace so the trace starts where the error
       was actually thrown.

5. The finished error object now contains:
     {
       name: "TooManyRequestsError",
       message: "Rate limit exceeded",
       statusCode: 429,
       isOperational: true,
       stack: "..."  // trimmed call stack for debugging
     }

6. When thrown in a controller or service, this instance bubbles up
   until caught by the global error-handling middleware, which reads
   `statusCode` and `message` to craft the HTTP response.

7. Thus every specific HTTP error (BadRequestError, NotFoundError, etc.)
   behaves consistently while preserving detailed context for logs and debugging.


*/
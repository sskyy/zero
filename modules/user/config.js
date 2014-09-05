module.exports = {
    validator : {
        login : {
          email: {
            type: 'string',
            required: true,
            match: /.+\@.+\..+/,
            message: 'email must be valid'
          }
        },
        registry : {
          name: {
            type: 'string',
            required: true,
            message: 'name is required'
          },
          email: {
            type: 'string',
            required: true,
            match: /.+\@.+\..+/,
            message: 'email must be valid'
          },
          password : {
            type : 'string',
            required: true
          }
        }
    }
  }

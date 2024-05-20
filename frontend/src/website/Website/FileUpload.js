import React, { useState } from 'react';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Helmet } from 'react-helmet';

const FileUpload = () => {
  const [loading, setLoading] = useState('Submit');

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   const formData = new FormData(event.currentTarget);
  //   const msg = {
  //     to: 'avigyabb@gmailcom',
  //     from: 'avigyabb@gmailcom',
  //     subject: 'Join Waitlist',
  //     text: `First Name: ${formData.get('firstName')}\nLast Name: ${formData.get('lastName')}\n\nAdditional Info: ${formData.get('additionalInfo')}`,
  //   };

  //   setLoading('Uploading...');

  //   emailjs.sendForm('service_m1chqti', 'YOUR_TEMPLATE_ID', msg, 'YOUR_USER_ID')
  //   .then((result) => {
  //       console.log('Email successfully sent!', result.text);
  //   }, (error) => {
  //       console.log('Failed to send email.', error.text);
  //   });

  //   setLoading('Submit');
  // };

  return (
    <div className="mt-5 flex flex-col" style={{color: "black"}}>
      <Box
          className='box'
          component="form"
          noValidate
          autoComplete="off"
      >
          <Typography variant="h3" gutterBottom style={{ color: 'black' }}>
              Join The Waitlist
          </Typography>
          <Typography className='text-sm' style={{ color: 'gray', marginBottom: '5%' }}> 
            ambora\social is an experimental social platform where you can rank things you care about.
          </Typography>
          {/* <div className='flex mt-8 mb-3 justify-between gap-3'>
              <TextField className="flex-grow" required id="firstName" name="firstName" label="First Name" variant="outlined"/>
              <TextField className="flex-grow" required id="lastName" name="lastName" label="Last Name" variant="outlined"/>
              <TextField
                  className="flex-grow"
                  required
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  variant="outlined"
              />
          </div>
          <TextField
              id="additionalDetails"
              name="additionalDetails"
              label="Why do you want to join?"
              multiline
              rows={4}
              variant="outlined"
          />
          <button id="submit-btn" type="submit" variant="contained" className="mt-8"> {loading} </button> */}
          <div class="launchlist-widget mt-8 mb-8" data-key-id="7KfOUJ" style={{width: '100%', marginBottom: '5%'}}></div>
          <Helmet>
            <script
              src="https://getlaunchlist.com/js/widget.js"
              type="text/javascript"
              defer
            />
          </Helmet>
      </Box>
    </div>
  );
};

export default FileUpload;

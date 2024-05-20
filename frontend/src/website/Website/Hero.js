import React from 'react'
import './Hero.css'
import WebNavbar from './WebNavbar'
import yc from './images/yc_logo.webp'
import rovaDemo from './rova_demo.mp4'
import { Link } from 'react-router-dom'
import { Typography } from '@mui/material'


const Hero = () => {
    const email = "founders@rovaai.com";
    const subject = encodeURIComponent("Join Waitlist");
    const body = encodeURIComponent("First Name:\nLast Name:\n\nCompany:\nRole:\n\nAdditional Info:");

    return (
        <>
        <WebNavbar />
        <div className='hero' style={{ height: '100vh' }}>
            {true ? (
                <div className='content'>
                    <div className='content2'>
                        <div className='backedby'>
                            <Typography style={{marginRight: '1%', fontSize: '14px'}}>Backed By</Typography>
                            <img src={yc} alt='yc' style={{ width: '108px', height: '30px' }}/>
                        </div>
                            <p></p>
                            <Typography>We are a group of friends from Stanford building something new. </Typography>
                        <div className='buttons'>
                            <div class="container">
                                {/* <a class="button2" href={`mailto:${email}?subject=${subject}&body=${body}`}> */}
                                <Link class="button2" to={'/'}>
                                    <span class="label-up" style={{fontFamily: 'PoppinsFont, sans-serif'}}>Join The Waitlist 🎉</span>
                                    <span class="label-up" style={{fontFamily: 'PoppinsFont, sans-serif'}}>Join the Waitlist 🎉</span>
                                </Link>
                            </div>
                        </div>
                        <Typography style={{fontSize: '14px', marginTop: '1%'}}> or email us at <a href="mailto:founders@rovaai.com" style={{color: '#FF8263'}}>founders@amboralabs.com</a></Typography>
                    </div>
                </div>
            ) : (
                <div className='signup flex'>
                    <div className='signup-description'>
                        <h1>Book a Demo</h1>
                    </div>
                </div>
            )}
        </div>
        </>
    )
}

export default Hero
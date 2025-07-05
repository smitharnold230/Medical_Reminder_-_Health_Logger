import React from 'react';
import PropTypes from 'prop-types';

const HeartIcon = (props) => (
  <svg
    width={props.width || 40}
    height={props.height || 40}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#256D85"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: 'middle', ...props.style }}
    {...props}
  >
    <path d="M12 21C12 21 7 16 4 12C1 8 4 4 7 4C10 4 12 7 12 7C12 7 14 4 17 4C20 4 23 8 20 12C17 16 12 21 12 21Z" />
    <path d="M12 7C12 7 13 10 16 10C19 10 20 8 20 8" />
  </svg>
);

HeartIcon.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object
};

export default HeartIcon;

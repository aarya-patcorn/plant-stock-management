import React from 'react';
import styled from 'styled-components';

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="loader" />
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .loader {
    width: 20px;
    height: 20px;
    color: #554cb5;
    position: relative;
    background: radial-gradient(5px, currentColor 94%, #0000);
  }

  .loader:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(4px at bottom right, #0000 94%, currentColor) top left,
      radial-gradient(4px at bottom left, #0000 94%, currentColor) top right,
      radial-gradient(4px at top right, #0000 94%, currentColor) bottom left,
      radial-gradient(4px at top left, #0000 94%, currentColor) bottom right;

    background-size: 10px 10px;
    background-repeat: no-repeat;

    animation: loader 1.5s infinite cubic-bezier(0.3, 1, 0, 1);
  }

  @keyframes loader {
    33% {
      inset: -5px;
      transform: rotate(0deg);
    }

    66% {
      inset: -5px;
      transform: rotate(90deg);
    }

    100% {
      inset: 0;
      transform: rotate(90deg);
    }
  }
`;

export default Loader;

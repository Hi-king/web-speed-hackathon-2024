import styled from 'styled-components';

import { Color } from '../styles/variables';

const _Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${Color.MONO_30};
`;

export const Separator: React.FC = () => {
  return <_Separator aria-hidden={true} />;
};

import { FC, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNetworkConfiguration } from '../contexts/NetworkConfigurationProvider';

const NetworkSwitcher: FC = () => {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();

  useEffect(() => {
    setNetworkConfiguration('testnet');
  }, [])

  return (
    <div className='m-5'>
      <label className="cursor-pointer label">
        <a>Network {networkConfiguration}</a>
        {/* <select             
        value={networkConfiguration}
        onChange={(e) => setNetworkConfiguration(e.target.value)} 
        className="select max-w-xs"
      >
        <option value="mainnet-beta">mainnet</option>
        <option value="testnet">testnet</option>
        <option value="devnet">devnet</option>
      </select> */}
      </label>
    </div>
  );
};

export default dynamic(() => Promise.resolve(NetworkSwitcher), {
  ssr: false
})
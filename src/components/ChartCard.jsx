import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './ChartCard.css';

const ChartCard = ({ title, dataKey, data, color }) => {
  return (
    <div className="chart-card">
      <h3 className="chart-card-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  dataKey: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  color: PropTypes.string.isRequired,
};

export default ChartCard;
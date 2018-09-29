import React, { Fragment } from "react";
import { Helmet } from "react-helmet";
import _ from "lodash";
import { FormattedNumber } from "react-intl";
import { TranslatedMessage } from "lib/TranslatedMessage";

import AggregateNetworkData from "../partials/AggregateNetworkData";
import NetworkThroughput from "../partials/network/NetworkThroughput";
import PeerVersions from "../partials/PeerVersions";

import { apiClient } from "lib/Client";
import config from "client-config.json";

export default class NetworkStatus extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      blocksByType: {},
      peers: {},
      representativesOnline: {},
      officialRepresentatives: {}
    };

    this.statTimer = null;
  }

  componentWillMount() {
    this.updateStats();
  }

  componentWillUnmount() {
    if (this.statTimer) clearTimeout(this.statTimer);
  }

  async updateStats() {
    this.setState({
      blocksByType: await apiClient.blockCountByType(),
      peers: await apiClient.peers(),
      representativesOnline: await apiClient.representativesOnline(),
      officialRepresentatives: await apiClient.officialRepresentatives()
    });

    this.statTimer = setTimeout(this.updateStats.bind(this), 10000);
  }

  rebroadcastThreshold() {
    return config.maxCoinSupply * 0.001;
  }

  rebroadcastableReps() {
    const { representativesOnline } = this.state;
    return _.fromPairs(
      _.toPairs(representativesOnline).filter(rep => {
        return parseFloat(rep[1], 10) >= this.rebroadcastThreshold();
      })
    );
  }

  onlineWeight() {
    const { representativesOnline } = this.state;
    return _.sum(
      _.values(representativesOnline).map(amt => parseFloat(amt, 10))
    );
  }

  onlineRebroadcastWeight() {
    const { representativesOnline } = this.state;
    return _.sum(
      _.values(representativesOnline)
        .map(amt => parseFloat(amt, 10))
        .filter(amt => amt >= this.rebroadcastThreshold())
    );
  }

  rebroadcastPercent() {
    return (
      <Fragment>
        {(
          (this.onlineRebroadcastWeight() / config.maxCoinSupply) *
          100.0
        ).toFixed(2)}%
      </Fragment>
    );
  }

  onlineRebroadcastPercent() {
    return (
      <Fragment>
        {(
          (this.onlineRebroadcastWeight() / this.onlineWeight()) *
          100.0
        ).toFixed(2)}%
      </Fragment>
    );
  }

  officialWeight() {
    const { officialRepresentatives } = this.state;
    return _.sum(
      _.values(officialRepresentatives).map(amt => parseFloat(amt, 10))
    );
  }

  amountRepresented() {
    return (
      <Fragment>
        <FormattedNumber
          value={this.onlineWeight()}
          maximumFractionDigits={0}
        />{" "}
        {config.currency}
      </Fragment>
    );
  }

  percentRepresented() {
    return (
      <Fragment>
        <FormattedNumber
          value={(this.onlineWeight() / config.maxCoinSupply) * 100.0}
          maximumFractionDigits={2}
        />%
      </Fragment>
    );
  }

  officialRepresented() {
    return (
      <Fragment>
        <FormattedNumber
          value={this.officialWeight()}
          maximumFractionDigits={0}
        />{" "}
        {config.currency}
      </Fragment>
    );
  }

  officialPercent() {
    return (
      <Fragment>
        <FormattedNumber
          value={(this.officialWeight() / config.maxCoinSupply) * 100}
          maximumFractionDigits={2}
        />%
      </Fragment>
    );
  }

  officialOnlinePercent() {
    return (
      <Fragment>
        <FormattedNumber
          value={(this.officialWeight() / this.onlineWeight()) * 100}
          maximumFractionDigits={2}
        />%
      </Fragment>
    );
  }

  totalBlocks() {
    const { blocksByType } = this.state;
    return _.sum(_.values(blocksByType).map(amt => parseInt(amt, 10)));
  }

  render() {
    const { representativesOnline } = this.state;

    return (
      <div className="p-4">
        <Helmet>
          <title>Network Status</title>
        </Helmet>

        <div className="row align-items-center">
          <div className="col-md">
            <h1>
              <TranslatedMessage id="network.title" />
            </h1>
          </div>
        </div>

        <hr />

        <div className="row mt-5">
          <div className="col-md">
            <h2 className="mb-0 text-muted">
              <TranslatedMessage
                id="network.reps_online"
                values={{
                  count: (
                    <span className="text-body">
                      <FormattedNumber
                        value={_.keys(representativesOnline).length}
                      />
                    </span>
                  )
                }}
              />
            </h2>
            <p className="text-muted">
              <TranslatedMessage id="network.reps_online_desc" />
            </p>

            <h5 className="mb-0 text-muted">
              <TranslatedMessage
                id="network.online_voting_power"
                values={{
                  count: (
                    <span className="text-body">
                      {this.amountRepresented()}
                    </span>
                  )
                }}
              />
            </h5>
            <p className="text-muted">
              <TranslatedMessage
                id="network.total_voting_power"
                values={{
                  percent: (
                    <span className="text-body">
                      {this.percentRepresented()}
                    </span>
                  )
                }}
              />
            </p>

            <h5 className="mb-0 text-muted">
              <TranslatedMessage
                id="network.official_reps"
                values={{
                  count: (
                    <span className="text-body">
                      {this.officialRepresented()}
                    </span>
                  )
                }}
              />
            </h5>
            <p className="text-muted">
              <TranslatedMessage
                id="network.official_reps_stat"
                values={{
                  totalPower: (
                    <span className="text-body">{this.officialPercent()}</span>
                  ),
                  onlinePower: (
                    <span className="text-body">
                      {this.officialOnlinePercent()}
                    </span>
                  )
                }}
              />
            </p>
          </div>
          <div className="col-md">
            <h2 className="mb-0 text-muted">
              <TranslatedMessage
                id="network.online_rebroadcasting"
                values={{
                  count: (
                    <span className="text-body">
                      <FormattedNumber
                        value={_.keys(this.rebroadcastableReps()).length}
                        maximumFractionDigits={0}
                      />
                    </span>
                  )
                }}
              />
            </h2>
            <p className="text-muted">
              <TranslatedMessage
                id="network.online_rebroadcasting_desc"
                values={{
                  amount: (
                    <FormattedNumber
                      value={this.rebroadcastThreshold()}
                      maximumFractionDigits={0}
                    />
                  )
                }}
              />
            </p>

            <h5 className="mb-0 text-muted">
              <TranslatedMessage
                id="network.rebroadcast_amt"
                values={{
                  count: (
                    <span className="text-body">
                      <FormattedNumber
                        value={this.onlineRebroadcastWeight()}
                        maximumFractionDigits={0}
                      />{" "}
                      {config.currency}
                    </span>
                  )
                }}
              />
            </h5>
            <p className="mb-0 text-muted">
              <TranslatedMessage
                id="network.rebroadcast_stat"
                values={{
                  totalPower: (
                    <span className="text-body">
                      {this.rebroadcastPercent()}
                    </span>
                  ),
                  onlinePower: (
                    <span className="text-body">
                      {this.onlineRebroadcastPercent()}
                    </span>
                  )
                }}
              />
            </p>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md">
            <NetworkThroughput />
          </div>
          <div className="col-md mt-3 mt-md-0">
            <PeerVersions peers={this.state.peers} />
          </div>
        </div>

        <AggregateNetworkData />
      </div>
    );
  }
}

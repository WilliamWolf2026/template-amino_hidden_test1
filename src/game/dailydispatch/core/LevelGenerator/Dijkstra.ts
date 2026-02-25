import { PriorityQueue } from '~/game/citylines/core/LevelGenerator/PriorityQueue';

export type NodeId = string;
export type Graph = Record<NodeId, Record<NodeId, number>>;

type Predecessors = Record<NodeId, NodeId>;
type Costs = Record<NodeId, number>;

const DIJKSTRA_LOOP_LIMIT = 10000; // Failsafe limit

export class Dijkstra {
  private singleSourceShortestPaths(
    graph: Graph,
    source: NodeId,
    destination?: NodeId,
  ): Predecessors | null {
    const predecessors: Predecessors = {};
    const costs: Costs = {};

    costs[source] = 0;

    const open = PriorityQueue.make<NodeId>({});

    open.push(source, 0);

    let closest;
    let v;
    let sToUCostPlusCostOfE;
    let sToVCost;
    let firstVisit;
    let adjacentNodes;
    let sToUCost;
    let costOfE;
    let u; // 'u' is the current node being processed.

    // Note: This counter is a critical failsafe. Pathfinding, especially on complex or
    // flawed graphs, can risk entering an infinite or extremely long loop. This
    // limit prevents the application from hanging by gracefully exiting if the
    // search becomes too extensive. It logs an error with context for debugging.
    let debug_dijkstra_counter = 0;

    while (!open.empty()) {
      debug_dijkstra_counter++;
      if (debug_dijkstra_counter > DIJKSTRA_LOOP_LIMIT) {
        return null;
      }

      closest = open.pop();

      if (!closest) {
        continue;
      }

      u = closest.value;
      sToUCost = closest.cost;

      // Explore neighbors of the current node.
      adjacentNodes = graph[u] || {};
      for (v in adjacentNodes) {
        if (adjacentNodes.hasOwnProperty(v)) {
          costOfE = adjacentNodes[v];

          // The core of Dijkstra's: If we've found a cheaper path to 'v' through 'u',
          // update its cost and predecessor, and add it to the queue to be explored.
          sToUCostPlusCostOfE = sToUCost + costOfE;
          sToVCost = costs[v];
          firstVisit = typeof costs[v] === 'undefined';

          if (firstVisit || sToVCost > sToUCostPlusCostOfE) {
            costs[v] = sToUCostPlusCostOfE;
            open.push(v, sToUCostPlusCostOfE);
            predecessors[v] = u;
          }
        }
      }
    }

    // If a destination 'd' is specified, and we couldn't find a path to it,
    // it means it's unreachable. Return null to indicate failure, which the
    // calling code must handle.
    if (typeof destination !== 'undefined' && typeof costs[destination] === 'undefined') {
      return null;
    }

    return predecessors;
  }

  // Reconstructs the path from the start to the destination 'd' by walking
  // backwards through the 'predecessors' list.
  private extractShortestPathFromPredecessorList(
    predecessors: Predecessors,
    destination: NodeId,
  ): NodeId[] {
    let nodes = [];
    let u = destination;

    while (u) {
      nodes.push(u);
      u = predecessors[u];
    }

    nodes.reverse(); // The path is built backwards, so it needs to be reversed.

    return nodes;
  };

  // A convenience function that combines finding the path and extracting it.
  public findPath(graph: Graph, source: NodeId, destination: NodeId): NodeId[] {
    const predecessors = this.singleSourceShortestPaths(graph, source, destination);

    if (predecessors === null) {
      return [];
    }

    return this.extractShortestPathFromPredecessorList(
      predecessors,
      destination,
    );
  }
}

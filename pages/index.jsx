import React from "react";
import Layout from "../components/layout/Layout";
import MainKeyVisual from "../components/main/MainKeyVisual";
import MainProfile from "../components/main/MainProfile";
import MainNews from "../components/main/MainNews";
import MainPractices from "../components/main/MainPractices";
import MainDealsAndCases from "../components/main/MainDealsAndCases";
import MainLocation from "../components/main/MainLocation";
import { fetchNaverBlogPosts } from "../lib/naverBlog";

function Home({ newsPosts }) {
  return (
    <>
      <Layout
        // @ts-ignore
        children={undefined}
      >
        <MainKeyVisual />
        <MainProfile />
        <MainPractices />
        <MainNews posts={newsPosts} />
        <MainDealsAndCases />
        <MainLocation />
      </Layout>
    </>
  );
}

// 블로그 RSS를 빌드 시 + 이후 최대 10분마다 다시 읽어옴 (ISR)
export async function getStaticProps() {
  const newsPosts = await fetchNaverBlogPosts(3);
  // 재생성 중 RSS 실패 시 에러를 던지면 Next.js가 직전 페이지를 그대로 유지함.
  // (첫 빌드에서는 빌드가 깨지지 않도록 빈 목록으로 진행)
  if (!newsPosts && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("네이버 블로그 RSS 불러오기 실패 - 이전 페이지 유지");
  }
  return {
    props: { newsPosts: newsPosts || [] },
    revalidate: 600,
  };
}

export default Home;
